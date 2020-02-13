import React, { Component } from "react";
import { connect } from "react-redux";
import { toggleSnackbar } from "../../actions";
import axios from "axios";
import OpenIcon from "@material-ui/icons/OpenInNew";
import Pagination from "@material-ui/lab/Pagination";
import FolderIcon from "@material-ui/icons/Folder";
import LockIcon from "@material-ui/icons/Lock";
import UnlockIcon from "@material-ui/icons/LockOpen";
import EyeIcon from "@material-ui/icons/RemoveRedEye";
import DeleteIcon from "@material-ui/icons/Delete";

import {
    withStyles,
    Tooltip,
    Card,
    Avatar,
    CardHeader,
    CardActions,
    Typography,
    Grid,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    TextField
} from "@material-ui/core";
import API from "../../middleware/Api";
import TypeIcon from "../FileManager/TypeIcon";
import Chip from "@material-ui/core/Chip";
import Divider from "@material-ui/core/Divider";
import { VisibilityOff, VpnKey } from "@material-ui/icons";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import {withRouter} from "react-router-dom";

const styles = theme => ({
    cardContainer: {
        padding: theme.spacing(1)
    },
    card: {
        maxWidth: 400,
        margin: "0 auto"
    },
    actions: {
        display: "flex"
    },
    layout: {
        width: "auto",
        marginTop: "50px",
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(1100 + theme.spacing(3) * 2)]: {
            width: 1100,
            marginLeft: "auto",
            marginRight: "auto"
        }
    },
    shareTitle: {
        maxWidth: "200px"
    },
    avatarFile: {
        backgroundColor: theme.palette.primary.light
    },
    avatarFolder: {
        backgroundColor: theme.palette.secondary.light
    },
    gird: {
        marginTop: "30px"
    },
    loadMore: {
        textAlign: "right",
        marginTop: "20px",
        marginBottom: "40px"
    },
    badge: {
        marginLeft: theme.spacing(1),
        height: 17
    },
    orderSelect:{
        textAlign:"right",
        marginTop: 5,
    }
});
const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = dispatch => {
    return {
        toggleSnackbar: (vertical, horizontal, msg, color) => {
            dispatch(toggleSnackbar(vertical, horizontal, msg, color));
        }
    };
};

class SearchComponent extends Component {
    state = {
        page: 1,
        total: 0,
        shareList: [],
        showPwd: null,
        orderBy:"created_at DESC",
    };

    componentDidMount = () => {
        this.loadList(1,this.state.orderBy);
    };

    showPwd = pwd => {
        this.setState({ showPwd: pwd });
    };

    handleClose = () => {
        this.setState({ showPwd: null });
    };

    removeShare = (id) => {
        API
            .delete("/share/"+id)
            .then(response => {
                    let oldList = this.state.shareList;
                    oldList = oldList.filter(value => {
                        return value.key !== id;
                    });
                    this.setState({
                        shareList: oldList,
                        total:this.state.total-1,
                    });
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        "分享已取消",
                        "success"
                    );
                    if (oldList.length === 0){
                        this.loadList(1,this.state.orderBy);
                    }

            })
            .catch(error => {
                this.props.toggleSnackbar("top", "right", error.message, "error");
            });
    };

    changePermission = id => {
        let newPwd = Math.random()
            .toString(36)
            .substr(2)
            .slice(2, 8);
        let oldList = this.state.shareList;
        let shareIndex = oldList.findIndex(value => {
            return value.key === id;
        });
        API
            .patch("/share/"+id, {
                prop:"password",
                value:oldList[shareIndex].password === "" ? newPwd : "",
            })
            .then(response => {
                oldList[shareIndex].password = response.data;
                this.setState({
                    shareList: oldList
                });
            })
            .catch(error => {
                this.props.toggleSnackbar("top", "right", error.message, "error");
            });
    };

    changePreviewOption = id => {
        let oldList = this.state.shareList;
        let shareIndex = oldList.findIndex(value => {
            return value.key === id;
        });
        API
            .patch("/share/"+id, {
                prop:"preview_enabled",
                value:oldList[shareIndex].preview?"false":"true",
            })
            .then(response => {
                oldList[shareIndex].preview = response.data;
                this.setState({
                    shareList: oldList
                });
            })
            .catch(error => {
                this.props.toggleSnackbar("top", "right", error.message, "error");
            });
    };

    loadList = (page,orderBy) => {
        let order = orderBy.split(" ");
        API.get("/share?page=" + page + "&order_by=" + order[0] + "&order=" + order[1])
            .then(response => {
                if (response.data.items.length === 0) {
                    this.props.toggleSnackbar(
                        "top",
                        "right",
                        "没有更多了",
                        "info"
                    );
                }
                this.setState({
                    total: response.data.total,
                    shareList: response.data.items
                });
            })
            .catch(error => {
                this.props.toggleSnackbar("top", "right", "加载失败", "error");
            });
    };

    handlePageChange = (event, value) => {
        this.setState({
            page: value
        });
        this.loadList(value,this.state.orderBy);
    };

    handleOrderChange =  event => {
        this.setState({
            orderBy:event.target.value,
        });
        this.loadList(this.state.page,event.target.value);
    };

    isExpired = share => {
        return share.expire === 0 || share.remain_downloads === 0;
    };

    render() {
        const { classes } = this.props;

        return (
            <div className={classes.layout}>
                <Grid container>
                    <Grid sm={6} xs={6}>
                        <Typography color="textSecondary" variant="h4">

                            搜索结果
                        </Typography>
                        </Grid>
                    <Grid sm={6} xs={6} className={classes.orderSelect}>
                        <FormControl>
                            <Select color={"secondary"}  onChange={this.handleOrderChange} value={this.state.orderBy}>
                                <MenuItem value={"created_at DESC"}>创建日期由晚到早</MenuItem>
                                <MenuItem value={"created_at ASC"}>创建日期由早到晚</MenuItem>
                                <MenuItem value={"downloads DESC"}>下载次数由大到小</MenuItem>
                                <MenuItem value={"downloads ASC"}>下载次数由小到大</MenuItem>
                                <MenuItem value={"views DESC"}>浏览次数由大到小</MenuItem>
                                <MenuItem value={"views ASC"}>浏览次数由小到大</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid container spacing={24} className={classes.gird}>
                    {this.state.shareList.map(value => (
                        <Grid
                            item
                            xs={12}
                            sm={4}
                            key={value.id}
                            className={classes.cardContainer}
                        >
                            <Card className={classes.card}>
                                <CardHeader
                                    avatar={
                                        <div>
                                            {!value.is_dir && (
                                                <TypeIcon
                                                    fileName={
                                                        value.source
                                                            ? value.source.name
                                                            : ""
                                                    }
                                                    isUpload
                                                />
                                            )}{" "}
                                            {value.is_dir && (
                                                <Avatar
                                                    className={
                                                        classes.avatarFolder
                                                    }
                                                >
                                                    <FolderIcon />
                                                </Avatar>
                                            )}
                                        </div>
                                    }
                                    title={
                                        <Tooltip
                                            placement="top"
                                            title={
                                                value.source
                                                    ? value.source.name
                                                    : "[原始对象不存在]"
                                            }
                                        >
                                            <Typography
                                                noWrap
                                                className={classes.shareTitle}
                                            >
                                                {value.source
                                                    ? value.source.name
                                                    : "[原始对象不存在]"}{" "}
                                            </Typography>
                                        </Tooltip>
                                    }
                                    subheader={
                                        <span>
                                            {value.create_date}
                                            {this.isExpired(value) && (
                                                <Chip
                                                    size="small"
                                                    className={classes.badge}
                                                    label="已失效"
                                                />
                                            )}
                                        </span>
                                    }
                                />
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                <div className={classes.loadMore}>
                    <Pagination
                            count={Math.ceil(this.state.total / 18)}
                            onChange={this.handlePageChange}
                            color="secondary"
                        />
                </div>{" "}
            </div>
        );
    }
}

const SearchResult = connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles)(withRouter(SearchComponent)));

export default SearchResult;